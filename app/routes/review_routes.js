// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for review
const Review = require('./../models/review')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

//  send 404 when non-existent document is requested
const handle404 = customErrors.handle404
// send 401 when a user tries to modify another user's document
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { review: { title: '', text: 'foo' } } -> { review: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const review = require('./../models/review')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /reviews
router.get('/reviews/all', requireToken, (req, res, next) => {
  Review.find()
    .then(reviews => {
      // `reviews` is an array of Mongoose documents
      // needs to be converted to POJO, so we use `.map` to
      // apply `.toObject` to each one
      return reviews.map(review => review.toObject())
    })
    // respond with status 200 and JSON of the reviews
    .then(reviews => res.status(200).json({ reviews: reviews }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// GET /reviews
router.get('/reviews', requireToken, (req, res, next) => {
  Review.find({ owner: req.user._id })
    .then(reviews => {
      // `reviews` is an array of Mongoose documents
      // needs to be converted to POJO, so we use `.map` to
      // apply `.toObject` to each one
      return reviews.map(review => review.toObject())
    })
    // respond with status 200 and JSON of the reviews
    .then(reviews => res.status(200).json({ reviews: reviews }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /reviews/5a7db6c74d55bc51bdf39793
router.get('/reviews/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Review.findById(req.params.id)
    .then(handle404)
    // if `findById` is successful, respond with 200 and "review" JSON
    .then(review => {
      requireOwnership(req, review)
      res.status(200).json({ review: review.toObject() })
    })
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /reviews
router.post('/reviews', requireToken, (req, res, next) => {
  // set owner of new review to be current user
  req.body.review.owner = req.user.id

  Review.create(req.body.review)
    // respond to successful `create` with status 201 and JSON of new "review"
    .then(review => {
      res.status(201).json({ review: review.toObject() })
    })
    // if an error occurs, pass to error handler
    // the error handler needs the error message and the `res` object to send error message back client
    .catch(next)
})

// UPDATE
// PATCH /review/5a7db6c74d55bc51bdf39793
router.patch('/reviews/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.review.owner

  Review.findById(req.params.id)
    .then(handle404)
    .then(review => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, review)

      // pass the result of Mongoose's `.update` to the next `.then`
      return review.updateOne(req.body.review)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /reviews/5a7db6c74d55bc51bdf39793
router.delete('/reviews/:id', requireToken, (req, res, next) => {
  Review.findById(req.params.id)
    .then(handle404)
    .then((review) => {
      requireOwnership(req, review)
      review.deleteOne()
    })
  // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
  // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
