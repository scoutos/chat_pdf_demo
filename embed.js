const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
require("dotenv").config();
const { Client } = require("pg");
const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

client.connect();

const pdfPath = "embeddings.pdf";
const load = async () => {
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();

  let postRes;
  for (const doc of docs) {
    const query = `
    INSERT INTO chat_pdf (content, metadata)
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
