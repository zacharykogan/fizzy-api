const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  drink: {
    name: String,
    type: String,
    review: String,
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    }},
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, 
  timestamps: true
  })

module.exports = mongoose.model('Review', reviewSchema)
