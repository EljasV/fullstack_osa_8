const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
}, {
    toJSON: {
        virtuals: true
    }, toObject: {
        virtuals: true
    }
})

schema.plugin(uniqueValidator)

schema.virtual("books", {
    ref: "BookGenre",
    localField: "_id",
    foreignField: "genre"
})

module.exports = mongoose.model('Genre', schema)