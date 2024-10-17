require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");

const url = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);

mongoose
  .connect(url)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

const Person = require("./models/person");

const errorHandler = (error, request, response, next) => {
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(express.static("dist"));
app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());
app.use(requestLogger);

morgan.token("body", (req) => JSON.stringify(req.body));

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/info", (request, response) => {
  Person.countDocuments({}).then((count) => {
    const dateStr = new Date().toString();
    response.send(
      `<p>Phonebook has info for ${count} people</p><br/><p>${dateStr}</p>`
    );
  });
});

app.get("/api/persons/:id", (request, response) => {
  Person.findById(request.params.id)
    .then((person) => {
      console.log("person ", person);
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;
  console.log("request body ", body);

  const updatedPerson = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, updatedPerson, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedPerson) => {
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const body = request.body;

  if (!body.name) {
    return response.status(400).json({
      error: "Name is missing",
    });
  }

  if (!body.number) {
    return response.status(400).json({
      error: "Number is missing",
    });
  }

  Person.findOne({ name: body.name }).then((existingPerson) => {
    if (existingPerson) {
      return response.status(400).json({ error: "Name should be unique" });
    } else {
      const person = new Person({
        name: body.name,
        number: body.number,
      });

      person
        .save()
        .then((savedPerson) => {
          response.json(savedPerson);
        })
        .catch((error) => next(error));
    }
  });
});

// handler of requests with unknown endpoint
app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
