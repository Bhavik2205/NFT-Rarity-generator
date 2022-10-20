import mongoose from "mongoose";

const rarityData2 = new mongoose.Schema({
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

var rarity2 = mongoose.model("rarity2", rarityData2);

export default rarity2;
