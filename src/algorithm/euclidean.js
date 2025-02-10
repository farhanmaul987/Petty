const fs = require("fs");
const path = require("path");

const preproData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/prepro_manhwa.json"), "utf-8")
);
const originalData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/manhwa_mal.json"), "utf-8")
);

const computeTF = (array_data) => {
  const tf = {};
  const totalWords = array_data.length;

  array_data.forEach((word) => {
    if (!tf[word]) {
      tf[word] = 0;
    }
    tf[word]++;
  });

  for (const word in tf) {
    tf[word] = tf[word] / totalWords;
  }

  return tf;
};

const computeIDF = (data) => {
  const idf = {};
  const totalDocuments = data.length;

  data.forEach((item) => {
    const seenWords = new Set(item.array_data);
    seenWords.forEach((word) => {
      if (!idf[word]) {
        idf[word] = 0;
      }
      idf[word]++;
    });
  });

  for (const word in idf) {
    idf[word] = Math.log(totalDocuments / idf[word]);
  }

  return idf;
};

const computeTFIDF = (tf, idf) => {
  const tfidf = {};

  for (const word in tf) {
    tfidf[word] = tf[word] * idf[word];
  }

  return tfidf;
};

const idf = computeIDF(preproData);
const processedData = preproData.map((item) => {
  const tf = computeTF(item.array_data);
  const tfidf = computeTFIDF(tf, idf);

  return {
    id: item.id,
    title: item.title,
    tf: tf,
    tfidf: tfidf,
  };
});

const euclideanDistance = (vecA, vecB) => {
  const distance = Math.sqrt(
    Object.keys(vecA).reduce((sum, key) => {
      const diff = (vecA[key] || 0) - (vecB[key] || 0);
      return sum + diff * diff;
    }, 0)
  );

  return distance;
};

const findManhwaByTitle = (title, data) => {
  return data.find((item) => item.title.toLowerCase() === title.toLowerCase());
};

const getEuclidean = (inputTitle) => {
  const manhwa = findManhwaByTitle(inputTitle, processedData);

  if (manhwa) {
    const distances = processedData.map((item) => {
      return {
        id: item.id,
        title: item.title,
        distance: euclideanDistance(manhwa.tfidf, item.tfidf),
      };
    });

    distances.sort((a, b) => a.distance - b.distance);

    const recommendations = distances.slice(1, 6).map((item) => {
      const originalItem = originalData.find(
        (dataItem) => dataItem.id === item.id
      );
      return {
        title: originalItem.title,
        genres: originalItem.genres,
        authors: originalItem.authors,
        synopsis: originalItem.synopsis,
        distance: item.distance.toFixed(4),
      };
    });

    return recommendations;
  }
};

module.exports = { getEuclidean };
