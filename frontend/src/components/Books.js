import {gql, useQuery} from "@apollo/client";
import {useState} from "react";


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

const ALL_GENRES = gql`
query
    {
        allGenres {
            name
        }
    }
`

const Books = (props) => {

    const [genreFilter, setGenreFilter] = useState(null)

    const bookResult = useQuery(ALL_BOOKS, {
        pollInterval: 2000,
        variables: {"genre": genreFilter}
    })

    const genreResult = useQuery(ALL_GENRES, {
        pollInterval: 2000
    })


    let books = []
    let genres = []

    if (!props.show) {
        return null
    }

    if (!bookResult.loading) {
        books = bookResult.data.allBooks;
    }

    if (!genreResult.loading) {
        genres = genreResult.data.allGenres.map(value => value.name)
    }

    return (
        <div>
            <h2>books</h2>

            <button onClick={async () => {
                setGenreFilter(null);
                await bookResult.refetch({"genre": null})
            }}>Reset genre filter</button>
            <div>
                {genres.map(value => <button onClick={async () => {
                    setGenreFilter(value);
                    await bookResult.refetch({"genre": value})
                }} key={value}>{value}</button>)}
            </div>

            {genreFilter ? <h3>All books</h3> : <h3>Books of {genreFilter}</h3>}

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
        </div>
    )
}

export default Books
