const mongoose = require("mongoose")
mongoose.set("strictQuery", false)
const Author = require("./models/author")
const Book = require("./models/book")

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


let authors = [
    {
        name: 'Robert Martin',
        id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
        born: 1952,
    },
    {
        name: 'Martin Fowler',
        id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
        born: 1963
    },
    {
        name: 'Fyodor Dostoevsky',
        id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
        born: 1821
    },
    {
        name: 'Joshua Kerievsky', // birthyear not known
        id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
    },
    {
        name: 'Sandi Metz', // birthyear not known
        id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
    },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conección con el libro
*/

let books = [
    {
        title: 'Clean Code',
        published: 2008,
        author: 'Robert Martin',
        id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Agile software development',
        published: 2002,
        author: 'Robert Martin',
        id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
        genres: ['agile', 'patterns', 'design']
    },
    {
        title: 'Refactoring, edition 2',
        published: 2018,
        author: 'Martin Fowler',
        id: "afa5de00-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Refactoring to patterns',
        published: 2008,
        author: 'Joshua Kerievsky',
        id: "afa5de01-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'patterns']
    },
    {
        title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
        published: 2012,
        author: 'Sandi Metz',
        id: "afa5de02-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'design']
    },
    {
        title: 'Crime and punishment',
        published: 1866,
        author: 'Fyodor Dostoevsky',
        id: "afa5de03-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'crime']
    },
    {
        title: 'The Demon ',
        published: 1872,
        author: 'Fyodor Dostoevsky',
        id: "afa5de04-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'revolution']
    },
]

/*
  you can remove the placeholder query once your first own has been implemented
*/

const typeDefs = `
  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
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
                }else{
                    return []
                }
            } else {
                byAuthor = {};
            }

            let byGenre = args.genre ? {...byAuthor, "genres": args.genre} : byAuthor
            let foundBooks = await Book.find(byGenre).populate("author")
            return foundBooks
        },
        allAuthors: async () => Author.find({})
    },
    Mutation: {
        addBook: async (root, args) => {

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
            const book = new Book({...args, author: foundAuthor._id})


            return book.save()
        },
        editAuthor: async (root, args) => {

            if (args.author.length < 4) {
                throw new GraphQLError("Author's name must be at least 4 characters long", {
                    extensions: {code: "INVALID_INFO", fieldContent: args.author}
                })
            }

            const update = args.setBornTo ? {born: args.setBornTo} : {}
            return Author.findOneAndUpdate({name: args.name}, update);
        }
    },
    Book: {
        title: (root) => root.title,
        published: (root) => root.published,
        author: (root) => root.author,
        id: (root) => root.id,
        genres: (root) => root.genres
    }
    ,
    Author: {
        name: (root) => root.name,
        bookCount: async (root) => {
            return Book.countDocuments({author: root._id})
            //return books.filter(book => book.author === root.name).length;
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

startStandaloneServer(server, {
    listen: {port: 4000},
}).then(({url}) => {
    console.log(`Server ready at ${url}`)
})