const mongoose = require('mongoose')

// you must install this library
const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        minlength: 5
    },
    published: {
        type: Number,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    }
}, {
    toJSON: {
        virtuals: true
    }, toObject: {
        virtuals: true
    }
})


schema.plugin(uniqueValidator)

schema.virtual("genres", {
    ref: "BookGenre",
    localField: "_id",
    foreignField: "book"
})

module.exports = mongoose.model('Book', schema)