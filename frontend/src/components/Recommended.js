import {gql, useQuery} from "@apollo/client";
import {useState} from "react";

const ME = gql`
query{
    me {
        favoriteGenre
    }
}`

const ALL_BOOKS = gql`
query($genre: String) {
  allBooks(genre: $genre) {
    title
    author
        {
            name
        }
    published
  }
}
`

const Recommended = ({show}) => {

    const [favoriteGenre, setFavoriteGenre] = useState(null)

    const meResult = useQuery(ME, {
        pollInterval: 2000
    })

    const bookResult = useQuery(ALL_BOOKS, {
        pollInterval: 2000,
        variables: {"genre": favoriteGenre}
    })


    if (!show) {

        return null
    }

    let books = []

    if (!bookResult.loading) {
        books = bookResult.data.allBooks;
    }

    if (!meResult.loading) {
        if (favoriteGenre !== meResult.data.me.favoriteGenre) {
            setFavoriteGenre(meResult.data.me.favoriteGenre)
        }
    }

    return <>
        <h2>Recommendations</h2>
        in genre <b>{favoriteGenre}</b>

        <table>
            <tbody>
            <tr>
                <th></th>
                <th>author</th>
                <th>published</th>
            </tr>
            {books.map((a) => (
                <tr key={a.title}>
                    <td>{a.title}</td>
                    <td>{a.author.name}</td>
                    <td>{a.published}</td>
                </tr>
            ))}
            </tbody>
        </table>
    </>
}

export default Recommended