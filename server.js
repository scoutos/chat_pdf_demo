// create a simple express server
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();
const { Client } = require("pg");
const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

client.connect();

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(bodyParser.json());

app.post("/chat/completions", async (req, res) => {
  try {
    const input = req.body.input;
    const query = `
    WITH query AS (
  SELECT pgml.embed(
        transformer => 'hkunlp/instructor-xl',
        text => $1,
        kwargs => '{
            "instruction": "Represent the question for retrieving supporting documents:"
        }'
    )::vector AS embedding
)
SELECT content FROM chat_pdf
ORDER BY chat_pdf.embedding <=> (SELECT embedding FROM query)
LIMIT 3;
  `;

    const postRes = await client.query(query, [input]);

    const textRows = postRes.rows;

    //
    const prompt = `
    You are teacher who assists users with understanding a pdf. Answer the user's questions only using the context's opinion. If you are unsure of the answer, tell the user you dont know.

    context's opinion: """
    ${textRows.map(({ content }) => content)}
    """

    user: ${input}

    assistant:
  `;

    const completionRes = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
    });

    const resp = completionRes.data.choices[0].message;

    res.send(resp);
  } catch (e) {
    console.log("e", e);
  }
});

app.listen(3334, () => {
  console.log(`Example app listening at http://localhost:${3334}`);
});
