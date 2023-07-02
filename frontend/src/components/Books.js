import {gql, useQuery} from "@apollo/client";


const ALL_BOOKS = gql`
query {
  allBooks {
    title
    author
        {
            name
        }
    published
  }
}
`

const Books = (props) => {
    const result = useQuery(ALL_BOOKS, {
        pollInterval: 2000
    })
    let books = []


    if (!props.show) {
        return null
    }

    if (!result.loading) {
        books = result.data.allBooks;
    }
    return (
        <div>
            <h2>books</h2>

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
