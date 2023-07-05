import {useState} from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from "./components/Login";
import Recommended from "./components/Recommended";


const App = () => {
    const [token, setToken] = useState(null)
    const [page, setPage] = useState('authors')


    return (
        <div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
                {token === null ? <button onClick={() => setPage("login")}>login</button> : null}
                {token !== null ?
                    <>
                        <button onClick={() => setPage('add')}>add book</button>
                        <button onClick={()=>setPage("recommended")}>Recommended</button>

                        <button onClick={() => {
                            localStorage.removeItem("loginToken")
                            setToken(null)
                        }}>logout
                        </button>
                    </>
                    : null}
            </div>

            <Authors show={page === 'authors'}/>

            <Books show={page === 'books'}/>

            <NewBook show={page === 'add'}/>

            <Login show={page === "login"} setToken={setToken}></Login>

            <Recommended show={page==="recommended"}></Recommended>
        </div>
    )
}

export default App
