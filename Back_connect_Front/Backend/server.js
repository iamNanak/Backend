import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Server is ready!');
});

app.get('/api/jokes', (req,res) => {
    const jokes = [
        {
            id: 1,
            title: "A Joke",
            content: "Funny Joke.. HAHAHA"
        },
        {
            id: 2,
            title: "Another Joke",
            content: "Another Funny Joke.. HAHAHA"
        },
        {
            id: 3,
            title: "A Third Joke",
            content: "Third Funny Joke.. HAHAHA"
        },
        {
            id: 4,
            title: "A Joke",
            content: "Funny Joke.. HAHAHA"
        },
        {
            id: 5,
            title: "Last Joke",
            content: "A Funny Joke.. HAHAHA"
        },
    ]
    res.send(jokes)
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is hosted at http://localhost:${port}`)
})