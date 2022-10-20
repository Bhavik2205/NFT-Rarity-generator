import mongoose from "mongoose";

const rarityData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  attributes: [
    {
      type: JSON,
    },
  ],
  rarity: {
    type: Number,
  },
  rank: {
    type: Number,
  },
  image: {
    type: String,
  },
});

var rarity = mongoose.model("rarity", rarityData);

export default rarity;
