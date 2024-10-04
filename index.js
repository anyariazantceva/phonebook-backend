const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

app.get('/api/persons', (request, response) => {
    response.json(persons)
})

app.get('/info', (request, response) => {
    const dateStr = new Date().toString();
    response.send(`<p>Phonebook has info for ${persons.length} people</p><br/><p>${dateStr}</p>`)
})

app.get('/api/persons/:id', (request, response) => {
    const id = request.params.id
    const person = persons.find(person => person.id === id)
    if(person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
    
})

app.delete('/api/persons/:id', (request, response) => {
    const id = request.params.id
    persons = persons.filter(person => person.id !== id)
    response.status(204).end()

})

const requestLogger = (request, response, next) => {
    console.log("Method:", request.method);
    console.log("Path:  ", request.path);
    console.log("Body:  ", request.body);
    console.log("---");
    next();
  };

app.use(express.json());
app.use(morgan('tiny'));
app.use(requestLogger);
app.use(cors());
app.use(express.static('dist'))
morgan.token("body", req => JSON.stringify(req.body));

 
const isUniqueName = (name) => {
    const person = persons.find(person => person.name === name);
    if(person) {
        return false
    } else {
        return true
    }
}

app.post('/api/persons', (request, response) => {
    const personId = Math.floor(Math.random() * 10000)
    const body = request.body

    if (!body.name) {
        return response.status(400).json({ 
          error: 'Name is missing' 
        })
    }

    if (!body.number) {
        return response.status(400).json({ 
          error: 'Number is missing' 
        })
    }

    if (!body.name) {
        return response.status(400).json({ 
          error: 'Name is missing' 
        })
    }

    if(!isUniqueName(body.name)) {
        return response.status(400).json({ 
            error: 'Name should be unique' 
          })
    }
    const person = {
        id: personId,
        name: body.name,
        number: body.number
    }
    
    response.json(person)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})