import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import NFT from "./DB.model.js";
import "./node_modules/dotenv/config.js";
import fetch from "node-fetch";
import rarity from "./rarity.model.js";
import cors from "cors";
import rarity2 from "./collection2rarity.js";

const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

//connecting to Database
mongoose
  .connect(process.env.DB_CONNECTION, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log(`processing on Port: ${process.env.PORT}`);
  })
  .catch((error) => {
    console.error({ message: "error" });
  });

  /*
const NFTfetching = async (req, res) => {
  for (var i = 476; i < 500; i++) {
    const response = await fetch(
      `https://croodleape.com/jungle-meta/${i}.json`
    );
    const data = await response.json();
    const saved = await NFT.create({
      id: data.id,
      name: data.name,
      description: data.description,
      image: data.image,
      dna: data.dna,
      edition: data.edition,
      date: data.date,
      compiler: data.compiler,
      attributes: data.attributes,
    });
    // NFT.bulkSave(data);
    console.log(saved);
  }
};
//NFTfetching();
*/
const generateRarity = async(req, res) => {
  let allNFTs = [];
  const totalNum = 500;

  for (let i = 1; i < 501; i++) {
    const response = await NFT.findOne({ id: i });
    allNFTs = allNFTs.concat(response);
  }

  let metadata;
  for (var i = 0; i < 500; i++) {
    metadata = allNFTs.map((e) => console.log(e));
    console.log(metadata);
  }
  //console.log(metadata);
  let tally = { TraitCount: {} };

  for (let j = 0; j < metadata.length; j++) {
    let nftTraits = metadata[j].map((e) => e.trait_type);
    let nftValues = metadata[j].map((e) => e.value);

    let numOfTraits = nftTraits.length;

    if (tally.TraitCount[numOfTraits]) {
      tally.TraitCount[numOfTraits]++;
    } else {
      tally.TraitCount[numOfTraits] = 1;
    }

    for (let i = 0; i < nftTraits.length; i++) {
      let current = nftTraits[i];
      if (tally[current]) {
        tally[current].occurences++;
      } else {
        tally[current] = { occurences: 1 };
      }

      let currentValue = nftValues[i];
      if (tally[current][currentValue]) {
        tally[current][currentValue]++;
      } else {
        tally[current][currentValue] = 1;
      }
    }
  }

  const collectionAttributes = Object.keys(tally);
  let nftArr = [];
  for (let j = 0; j < metadata.length; j++) {
    let current = metadata[j];
    let totalRarity = 0;
    for (let i = 0; i < current.length; i++) {
      let rarityScore =
        1 / (tally[current[i].trait_type][current[i].value] / totalNum);
      current[i].rarityScore = rarityScore;
      totalRarity += rarityScore;
    }

    let rarityScoreNumTraits =
      8 * (1 / (tally.TraitCount[Object.keys(current).length] / totalNum));
    current.push({
      trait_type: "TraitCount",
      value: Object.keys(current).length,
      rarityScore: rarityScoreNumTraits,
    });
    totalRarity += rarityScoreNumTraits;

    if (current.length < collectionAttributes.length) {
      let nftAttributes = current.map((e) => e.trait_type);
      let absent = collectionAttributes.filter(
        (e) => !nftAttributes.includes(e)
      );

      absent.forEach((type) => {
        let rarityScoreNull =
          1 / ((totalNum - tally[type].occurences) / totalNum);
        current.push({
          trait_type: type,
          value: null,
          rarityScore: rarityScoreNull,
        });
        totalRarity += rarityScoreNull;
      });
    }

    if (allNFTs[j].metadata) {
      allNFTs[j].metadata = JSON.parse(allNFTs[j].metadata);
      allNFTs[j].image = resolveLink(allNFTs[j].metadata.image);
    } else if (allNFTs[j].token_uri) {
      try {
        await fetch(allNFTs[j].token_uri)
          .then((response) => response.json())
          .then((data) => {
            allNFTs[j].image = resolveLink(data.image);
          });
      } catch (error) {
        console.log(error);
      }
    }

    nftArr.push({
      Attributes: current,
      Rarity: totalRarity,
      token_id: allNFTs[j].token_id,
      image: allNFTs[j].image,
    });
  }

  nftArr.sort((a, b) => b.Rarity - a.Rarity);

  for (let i = 0; i < nftArr.length; i++) {
    //nftArr[i].Rank = i + 1;
    const dbFind = await NFT.findOne({ image: nftArr[i].image });
    console.log(nftArr[i]);
    const data = {
      name: dbFind.name,
      attributes: nftArr[i].Attributes,
      rarity: nftArr[i].Rarity,
      rank: nftArr[i].Rank,
      image: nftArr[i].image,
    };
    const saved = await rarity2.create(data);
    console.log(saved);

    /*
    const newClass = mongoose.Object.extend(collectionName);
    const newObject = new newClass();

    newObject.set("attributes", nftArr[i].Attributes);
    newObject.set("rarity", nftArr[i].Rarity);
    newObject.set("tokenId", nftArr[i].token_id);
    newObject.set("rank", nftArr[i].Rank);
    newObject.set("image", nftArr[i].image);
    await newObject.save();
    console.log(i);
    */
  }

  return true;
}

generateRarity()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });
