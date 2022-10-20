import mongoose from "mongoose";

const DBModel = new mongoose.Schema({
  id: {
    type: Number,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  dna: {
    type: String,
  },
  edition: {
    type: String,
  },
  date: {
    type: Date,
  },
  compiler: {
    type: String,
  },
  attributes: [
    {
      type: JSON,
    },
  ],
});

var DBmodel = mongoose.model("DBmodel", DBModel);

export default DBmodel;
