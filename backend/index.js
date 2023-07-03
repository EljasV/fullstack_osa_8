const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

mongoose.set("strictQuery", false)
const Author = require("./models/author")
const Book = require("./models/book")
const User = require("./models/user")
const Genre = require("./models/genre")
const BookGenre = require("./models/bookGenre")

require("dotenv").config()

const {ApolloServer} = require('@apollo/server')
const {startStandaloneServer} = require('@apollo/server/standalone')

const {v1: uuid} = require("uuid");
const {GraphQLError} = require("graphql/error");

const MONGODB_URI = process.env.MONGODB_URI

console.log("connecting to mongoDB")

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("connected to MongoDB")
    }).catch((error) => {
    console.log("error connecting to MongoDB", error.message)
})

const typeDefs = `
  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
    allGenres: [Genre!]!
  }
  
  type Genre{
    name: String!
    books: [Book!]!
  }
  
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [Genre!]!
  }
  
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }
  
  type Mutation {
    addBook(title: String!, author: String!, published: Int!, genres: [String!]!): Book
    editAuthor(name: String!, setBornTo: Int): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
  
  type User {
  username: String!
  favoriteGenre: String!
  id: ID!
  }

  type Token {
  value: String!
  }
`

const resolvers = {
    Query: {
        bookCount: async () => Book.collection.countDocuments(),
        authorCount: async () => Author.collection.countDocuments(),
        allBooks: async (root, args) => {

            let byAuthor;
            if (args.author) {

                if (args.author.length < 4) {
                    throw new GraphQLError("Author's name must be at least 4 characters long", {
                        extensions: {code: "INVALID_INFO", fieldContent: args.author}
                    })
                }

                const auth = await Author.findOne({name: args.author})
                if (auth) {
                    byAuthor = {author: auth._id};
                } else {
                    return []
                }
            } else {
                byAuthor = {};
            }

            //let byGenre = args.genre ? {...byAuthor, "genres": args.genre} : byAuthor
            let byGenre = byAuthor
            let foundBooks = await Book.find(byGenre)
            return foundBooks
        },
        allAuthors: async () => Author.find({}),
        me: async (root, args, context) => {
            return context.currentUser
        },
        allGenres: async () => {
            return Genre.find({})
        }
    },
    Mutation: {
        addBook: async (root, args, context) => {

            if (!context.currentUser) {
                throw new GraphQLError("You must be logged in in order to add books.", {
                    extensions: {
                        code: "NOT_LOGGED_IN"
                    }
                })
            }

            if (args.author.length < 4) {
                throw new GraphQLError("Author's name must be at least 4 characters long", {
                    extensions: {code: "INVALID_INFO", fieldContent: args.author}
                })
            }
            if (args.title.length < 5) {
                throw new GraphQLError("Book's name must be at least 5 characters long", {
                    extensions: {code: "INVALID_INFO", fieldContent: args.args.title}
                })
            }

            let foundAuthor = await Author.findOne({name: args.author})
            if (!foundAuthor) {
                foundAuthor = await new Author({name: args.author}).save()
            }

            const book = await new Book({
                title: args.title,
                published: args.published,
                author: foundAuthor._id
            }).save()

            for (const genreString of args.genres) {
                const genreObject = await Genre.findOneAndUpdate({name: genreString}, {}, {upsert: true, new: true})
                await new BookGenre({genre: genreObject._id, book: book._id}).save()
            }


            return book
        },
        editAuthor: async (root, args, context) => {

            if (!context.currentUser) {
                throw new GraphQLError("You must be logged in in order to edit authors.", {
                    extensions: {
                        code: "NOT_LOGGED_IN"
                    }
                })
            }

            if (args.name.length < 4) {
                throw new GraphQLError("Author's name must be at least 4 characters long", {
                    extensions: {code: "INVALID_INFO", fieldContent: args.author}
                })
            }

            const update = args.setBornTo ? {born: args.setBornTo} : {}
            return Author.findOneAndUpdate({name: args.name}, update, {new: true})
        },
        createUser: async (root, args) => {
            const user = new User({username: args.username, favoriteGenre: args.favoriteGenre})
            return user.save().catch(error => {
                throw new GraphQLError("Provided information is not correct for user creation.", {
                    extensions: {
                        code: "INVALID_INFO"
                    },
                    args: args,
                    error
                })
            })
        },
        login: async (root, args) => {
            const user = await User.findOne({username: args.username})

            if (!user || args.password !== "secret") {
                throw new GraphQLError("Invalid login info", {
                    extensions: {
                        code: "INVALID_INFO",
                        username: args.username
                    }
                })
            }

            const tokenObject = {
                username: user.username,
                id: user.id
            }
            return {value: jwt.sign(tokenObject, process.env.JWT_SECRET)}
        }
    },
    Book: {
        title: (root) => root.title,
        published: (root) => root.published,
        author: async (root) => {
            let authorID = root.author;
            let author = Author.findById(authorID)
            return author
        },
        id: (root) => root.id,
        genres: async (root) => {
            const populate = await root.populate({path: "genres", populate: {path: "genre", justOne: true}})
            return populate.genres.map(value => value.genre);
        }
    }
    ,
    Author: {
        name: (root) => root.name,
        bookCount: async (root) => {
            return Book.countDocuments({author: root._id})
        }
    },
    Genre: {
        name: (root) => root.name,
        books: async (root) => {
            const populate = await root.populate({path: "books", populate: {path: "book", justOne: true}})
            return populate.books.map(value => value.book)
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

startStandaloneServer(server, {
    listen: {port: 4000},
    context: async ({req, res}) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith("Bearer ")) {
            const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
            const currentUser = await User.findById(decodedToken.id)
            return {currentUser}
        }
    }
}).then(({url}) => {
    console.log(`Server ready at ${url}`)
})