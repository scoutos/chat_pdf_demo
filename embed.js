const { CSVLoader } = require("langchain/document_loaders/fs/csv")
require("dotenv").config();
const { Client } = require("pg");
const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

client.connect();


const csvPath = "./courses_data.csv";
const load = async () => {

  const loader = new CSVLoader(csvPath);

  const docs = await loader.load();





  let postRes;
  for (const doc of docs) {
    const query = `
    INSERT INTO chat_course_catalog (content, metadata)
    SELECT
      $1,
      $2
  `;

    postRes = await client.query(query, [doc.pageContent, doc.metadata]);
  }

  console.log(`succesfully inserted ${docs.length} page embeddings.`);
};

load()
  .then(() => {
    // close node process
    process.exit(0);
  })
  .catch((err) => console.log("err", err));
