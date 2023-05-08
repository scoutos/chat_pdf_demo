create extension vector;
create extension pgml;


CREATE TABLE chat_pdf (
    id SERIAL PRIMARY KEY,
    content text,
    metadata json,
    embedding vector(768) GENERATED ALWAYS AS (pgml.embed(
        transformer => 'hkunlp/instructor-xl',
        text => content,
        kwargs => '{"instruction": "Represent the content for retrieving supporting documents:"}'
        )) STORED
);