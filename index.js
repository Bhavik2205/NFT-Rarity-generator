import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import NFT from "./DB.model.js";
import "./node_modules/dotenv/config.js";
import fetch from "node-fetch";
import rarity from "./rarity.model.js";
import cors from "cors";
import rarity2 from "./collection2rarity.js";
import fs from 'fs';

const app = express();

app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
//app.use(cors());
app.post("/generate", async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    console.log("request received");
    let allNFTs = [];
    const totalNum = req.body.stop;
    const link = req.body.link;
    let data;
    for (let i = req.body.start; i < req.body.stop; i++) {
      const response = await fetch(link + `${i}.json`);
      data = await response.json();
      console.log(data);
      allNFTs = allNFTs.concat(data);
    }
    console.log(`data fetched successfully`);
    let metadata;
    for (var i = 0; i < req.body.stop; i++) {
      metadata = allNFTs.map((e) => e.attributes);
    }
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
        image: allNFTs[j].image,
      });
    }

    nftArr.sort((a, b) => b.Rarity - a.Rarity);

    for (let i = 0; i < nftArr.length; i++) {
      console.log(nftArr[i]);
    }
    fs.writeFile("myFile.json", JSON.stringify(nftArr), (err) => {
      // Checking for errors
      if (err) throw err;

      res
        .status(200)
        .json({ Success: `Rarity generated for ${nftArr.length}` });
      console.log("Done writing"); // Success
    });
    return true;
  } catch (error) {
    console.log(error);
    res.status(419).json({ error: error});
  }
});

app.listen(process.env.PORT)
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