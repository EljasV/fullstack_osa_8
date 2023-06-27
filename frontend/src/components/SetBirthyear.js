import {gql, useMutation} from "@apollo/client";
import {useState} from "react";


const EDIT_AUTHOR = gql`
mutation EditAuthor($setBornTo: Int, $name: String!) {
  editAuthor(setBornTo: $setBornTo, name: $name) {
    name
  }
}
`

export function SetBirthyear({authors}) {
    const [author, setAuthor] = useState("")
    const [year, setYear] = useState("1900")

    const [editAuthor] = useMutation(EDIT_AUTHOR)

    if (authors.length === 0) {
        return null
    }
    if (author === "") {
        setAuthor(authors[0].name)
    }


    const submit = async (event) => {
        event.preventDefault()
        console.log(author.concat(year))
        editAuthor({variables: {name: author, setBornTo: parseInt(year, 10)}})
    }

    return <div>
        <h2>Set birthyear</h2>
        <form onSubmit={submit}>
            <div>
                <select value={author} onChange={({target}) => setAuthor(target.value)}>
                    {authors.map(author => <option key={author.name} value={author.name}>{author.name}</option>)}
                </select>
            </div>
            <div>
                <input type="number" value={year} onChange={({target}) => setYear(target.value)}/>
            </div>
            <button type="submit">Update author</button>
        </form>
    </div>;
}