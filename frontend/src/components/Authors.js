import {gql, useQuery} from "@apollo/client";
import {SetBirthyear} from "./SetBirthyear";


const ALL_AUTHORS = gql`
query {
  allAuthors{
    name
    born
    bookCount
  }
}
`

const Authors = (props) => {
    const result = useQuery(ALL_AUTHORS, {
        pollInterval: 2000
    })

    let authors = []

    if (!result.loading) {
        authors = result.data.allAuthors;
    }

    if (!props.show) {
        return null
    }

    return (
        <>
            <div>
                <h2>authors</h2>
                <table>
                    <tbody>
                    <tr>
                        <th></th>
                        <th>born</th>
                        <th>books</th>
                    </tr>
                    {authors.map((a) => (
                        <tr key={a.name}>
                            <td>{a.name}</td>
                            <td>{a.born}</td>
                            <td>{a.bookCount}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <SetBirthyear authors={authors}/>
        </>
    )
}

export default Authors
