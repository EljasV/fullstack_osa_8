import {useEffect, useState} from "react";
import {gql, useMutation} from "@apollo/client";

const LOGIN = gql`
    mutation login($username: String!, $password: String!){
        login(username: $username, password: $password){
            value
        }
    }
`

const Login = ({show, setToken}) => {
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")

    const [login, result] = useMutation(LOGIN)

    useEffect(() => {
        if (result.data) {
            const token = result.data.login.value
            setToken(token)
            localStorage.setItem("loginToken",token)
        }
    },[result.data])

    if (!show) {
        return null
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        login({variables: {username: name, password}})
        setName("")
        setPassword("")
    }

    return <form onSubmit={onSubmit}>
        <div>
            name
            <input value={name} onChange={({target}) => setName(target.value)}/>
        </div>
        <div>
            password
            <input type="password" value={password} onChange={({target}) => setPassword(target.value)}/>
        </div>
        <button type="submit">Login</button>
    </form>

};

export default Login