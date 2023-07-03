const mongoose = require("mongoose");


const schema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    genre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre",
        required: true
    }
})

module.exports = mongoose.model('BookGenre', schema)