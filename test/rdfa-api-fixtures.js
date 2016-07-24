import * as rdfa from '../src/external/RDFa.js';

export function rdfaDocumentDataSimple() {
  return newDocumentData(simpleTurtleString());
}

export function rdfaDocumentDataComplex() {
  return newDocumentData(turtleString());
}

function newDocumentData(turtleString) {
  let graph = newRdfaMovieGraph(turtleString);
  let data = GreenTurtle.implementation.createDocumentData("http://example.org");
  data.merge(graph.subjects, {
    prefixes: graph.prefixes,
    mergeBlankNodes: true
  });
  return data;
}

function newRdfaMovieGraph(turtleString) {
  let turtleParser = GreenTurtle.implementation.processors['text/turtle'].createParser();
  turtleParser.parse(turtleString);
  return turtleParser.context;
}

function simpleTurtleString() {
  return `<https://www.rottentomatoes.com/m/spectre_2015/> <http://ogp.me/ns#title> "Spectre";
 <http://ogp.me/ns#type> "video.movie" .`;
}

function turtleString() {
  return `<https://www.rottentomatoes.com/m/spectre_2015/> <http://www.facebook.com/2008/fbmlapp_id> "326803741017";
 <http://ogp.me/ns#title> "Spectre";
 <http://ogp.me/ns#type> "video.movie";
 <http://ogp.me/ns#image> "https://resizing.flixster.com/PxOheQnxttU87xGByGAAXVNAj_g=/740x290/v1.bjs1Mzg4NjA7ajsxNzA2MTsxMjAwOzYxNDQ7MzQ1Ng";
 <http://ogp.me/ns#image:width> "740";
 <http://ogp.me/ns#image:height> "290";
 <http://ogp.me/ns#url> "https://www.rottentomatoes.com/m/spectre_2015/";
 <http://ogp.me/ns#description> "A cryptic message from Bond's past sends him on a trail to uncover a sinister organisation. While M battles political forces to keep the secret service alive, Bond peels back the layers of deceit to reveal the terrible truth behind Spectre.";
 <video:duration> "150";
 <video:director> "https://www.rottentomatoes.com";
 <http://schema.org/Review> "_:8dcac657-96b5-436f-afa9-eaf27add6b5a" .
_:5e57cd74-2824-40ab-95ab-876184d9e746 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Movie";
 <http://schema.org/name> "Spectre";
 <http://schema.org/description> "A cryptic message from Bond's past sends him on a trail to uncover a sinister organisation. While M battles political forces to keep the secret service alive, Bond peels back the layers of deceit to reveal the terrible truth behind Spectre.";
 <http://schema.org/contentRating> "PG13";
 <http://schema.org/dateModified> "2016-07-22T17:46:00-07:00";
 <http://schema.org/dateCreated> "2013-07-11T06:30:23-07:00";
 <http://schema.org/datePublished> "2015";
 <http://schema.org/sameAs> "http://www.007.com/";
 <http://schema.org/duration> "PT150M";
 <http://schema.org/url> "www.rottentomatoes.com/m/spectre_2015";
 <http://schema.org/actor> "_:06724c72-9a14-448b-9a5e-b2bc443c7279";
 <http://schema.org/director> "_:606949d4-0ddc-4a46-a3e1-756e52d22b5b";
 <http://schema.org/author> "_:fadd4855-480e-4bbf-a5f6-a859e66e3a8e";
 <http://schema.org/productionCompany> "_:10000476-f1a1-46ba-b51d-8e301b2eccb3";
 <http://schema.org/aggregateRating> "_:3b8efc37-afb1-4c48-b115-d65fade356bc";
 <http://schema.org/genre> "_:584c63e2-23f3-4825-bbd3-0398cb73c789";
 <http://schema.org/review> "_:6519ff07-8a74-452e-92fb-c8b43efea3d3";
 <http://schema.org/image> "_:2bf291e1-ac83-402a-afa9-546636d3c5f6";
 <http://schema.org/releasedEvent> "_:2fa8bc71-b0b7-4af8-a722-67ca36f21311";
 <http://schema.org/character> "_:27e7ac4b-913f-4f8b-86b3-fcb7ae931e8a";
 <http://schema.org/Review> "_:e42ba5bc-2dde-44c9-bb37-4864871a180e", "_:6388e6bc-7b2a-4420-8f3c-7cfd913671a8" .
_:10000476-f1a1-46ba-b51d-8e301b2eccb3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Sony Pictures" .
_:3b8efc37-afb1-4c48-b115-d65fade356bc <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/AggregateRating";
 <http://schema.org/ratingValue> "65";
 <http://schema.org/bestRating> "100";
 <http://schema.org/worstRating> "0";
 <http://schema.org/reviewCount> "307";
 <http://schema.org/name> "Tomatometer";
 <http://schema.org/description> "The Tomatometer rating – based on the published opinions of hundreds of film and television critics – is a trusted measurement of movie and TV programming quality for millions of moviegoers. It represents the percentage of professional critic reviews that are positive for a given film or television show." .
_:584c63e2-23f3-4825-bbd3-0398cb73c789 <http://schema.org/0> "Action & Adventure" .
_:2bf291e1-ac83-402a-afa9-546636d3c5f6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/ImageObject";
 <http://schema.org/width> "960";
 <http://schema.org/height> "1422";
 <http://schema.org/url> "https://resizing.flixster.com/pZ40z1j1KL1OYZW504_-OVOkEzU=/fit-in/960x1422/v1.bTsxMTIwMzM3NDtqOzE3MDk0OzEyMDA7OTYwOzE0MjI" .
_:15ee809d-08bb-4d9b-aaca-c61dd59ab370 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Daniel Craig" .
_:06724c72-9a14-448b-9a5e-b2bc443c7279 <http://schema.org/0> "_:15ee809d-08bb-4d9b-aaca-c61dd59ab370";
 <http://schema.org/1> "_:94af525a-0892-44b3-bfd5-bcd0b9ad9de1";
 <http://schema.org/2> "_:efddf40c-0597-419b-9a82-6a2859f29f1b";
 <http://schema.org/3> "_:99d938d4-be70-4762-a1d1-2e7cb30d541e";
 <http://schema.org/4> "_:483258ea-9cfc-44fc-b30c-ae6f10b86382";
 <http://schema.org/5> "_:c24d6519-aa9a-466a-893f-ca92ca874113";
 <http://schema.org/6> "_:50735e1b-7360-4e20-8938-1e8a4f2d317e";
 <http://schema.org/7> "_:2291061c-b81a-4972-85cc-df38e952969e";
 <http://schema.org/8> "_:c4f18ad4-d750-434f-bc49-bdd80718d6bb";
 <http://schema.org/9> "_:ede6da49-175a-42c1-975e-5c6fa9c98e1b";
 <http://schema.org/10> "_:ad8e7674-7efd-47dc-a7eb-f17db85c7634";
 <http://schema.org/11> "_:157104f8-b33a-4bd2-8d61-3d01aab25d79";
 <http://schema.org/12> "_:5bc3b352-2874-4e12-9847-a01569c84065";
 <http://schema.org/13> "_:56e952ba-e0fe-40b5-987a-e9becd16a98a";
 <http://schema.org/14> "_:5e82216f-0bff-4b8a-a1f1-29320c82ee4e";
 <http://schema.org/15> "_:f0449cd3-eb56-483f-9c01-5ea3b72a9833";
 <http://schema.org/16> "_:d9b70a8f-4b57-4df0-a933-4050147835e3";
 <http://schema.org/17> "_:719f0238-940e-4c19-87a3-618bed66455d";
 <http://schema.org/18> "_:b886f50a-dc32-4903-9e4a-a5096abf25ef";
 <http://schema.org/19> "_:6d709e54-b125-4af4-9f68-369b74f38be7" .
_:94af525a-0892-44b3-bfd5-bcd0b9ad9de1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Christoph Waltz" .
_:efddf40c-0597-419b-9a82-6a2859f29f1b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Naomie Harris" .
_:99d938d4-be70-4762-a1d1-2e7cb30d541e <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Ben Whishaw" .
_:483258ea-9cfc-44fc-b30c-ae6f10b86382 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Dave Bautista" .
_:c24d6519-aa9a-466a-893f-ca92ca874113 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Monica Bellucci" .
_:50735e1b-7360-4e20-8938-1e8a4f2d317e <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Ralph Fiennes" .
_:2291061c-b81a-4972-85cc-df38e952969e <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Jesper Christensen" .
_:c4f18ad4-d750-434f-bc49-bdd80718d6bb <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Stephanie Sigman" .
_:ede6da49-175a-42c1-975e-5c6fa9c98e1b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Andrew Scott" .
_:ad8e7674-7efd-47dc-a7eb-f17db85c7634 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Rory Kinnear" .
_:157104f8-b33a-4bd2-8d61-3d01aab25d79 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Léa Seydoux" .
_:5bc3b352-2874-4e12-9847-a01569c84065 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Alessandro Cremona" .
_:56e952ba-e0fe-40b5-987a-e9becd16a98a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Tenoch Huerta Mejía" .
_:5e82216f-0bff-4b8a-a1f1-29320c82ee4e <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Adriana Paz" .
_:f0449cd3-eb56-483f-9c01-5ea3b72a9833 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Domenico Fortunato" .
_:d9b70a8f-4b57-4df0-a933-4050147835e3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Dominic Fortunato" .
_:719f0238-940e-4c19-87a3-618bed66455d <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Marco Zingaro" .
_:b886f50a-dc32-4903-9e4a-a5096abf25ef <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Stefano Elfi DiClaudia" .
_:6d709e54-b125-4af4-9f68-369b74f38be7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Stefano Elfi DiClaudia" .
_:946fa68c-abea-4ae7-91d9-ebc5399d0f66 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Sam Mendes" .
_:606949d4-0ddc-4a46-a3e1-756e52d22b5b <http://schema.org/0> "_:946fa68c-abea-4ae7-91d9-ebc5399d0f66" .
_:81e5f4f5-211d-458a-a682-6560ff570ed6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "John Logan" .
_:fadd4855-480e-4bbf-a5f6-a859e66e3a8e <http://schema.org/0> "_:81e5f4f5-211d-458a-a682-6560ff570ed6";
 <http://schema.org/1> "_:d531e05b-d805-4de8-b50a-33f8d05bbe34";
 <http://schema.org/2> "_:c7c6039d-11d9-4253-aa24-547310596bca";
 <http://schema.org/3> "_:efb0cf81-10ca-40be-a5e8-6295291cce29" .
_:d531e05b-d805-4de8-b50a-33f8d05bbe34 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Neal Purvis" .
_:c7c6039d-11d9-4253-aa24-547310596bca <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Robert Wade" .
_:efb0cf81-10ca-40be-a5e8-6295291cce29 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Ian Fleming" .
_:bf4740f5-18eb-4a9a-a261-928e5e2523e0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "Spectre is sloppier than other recent Bonds, but it also feels like it's exhausted the idea that fueled the franchise's relaunch -- darker and more realistic can only last so long when it's paired with a rotating cast of Bond girls and supervillains.";
 <http://schema.org/url> "http://www.buzzfeed.com/alisonwillmore/spectre-review";
 <http://schema.org/dateCreated> "2015-11-09T12:54:11-08:00";
 <http://schema.org/author> "_:620cf7bf-0c8f-45fe-b863-0a7275619de7";
 <http://schema.org/publisher> "_:bf733c71-0a43-4698-9bc9-a3cd8b0c4a3a";
 <http://schema.org/reviewRating> "_:8b9cb4f9-0a98-4420-991e-ad8d3f879aa3" .
_:6519ff07-8a74-452e-92fb-c8b43efea3d3 <http://schema.org/0> "_:bf4740f5-18eb-4a9a-a261-928e5e2523e0";
 <http://schema.org/1> "_:63aa3ba5-c02d-4aa7-9504-c5f0760383bd";
 <http://schema.org/2> "_:5a3e4ff3-225c-4d3d-9f3d-085bfad9856b";
 <http://schema.org/3> "_:54a398c5-f766-471b-8114-3df2a4855653";
 <http://schema.org/4> "_:afc80ad9-c094-4c4e-a910-484e0d50e31d";
 <http://schema.org/5> "_:505cc865-1613-4167-8b02-677a23188efd";
 <http://schema.org/6> "_:4c8d82e6-c563-46fc-b431-a5424371496a";
 <http://schema.org/7> "_:1b7fd8a8-e39a-4322-9dfc-f60e49d0e912";
 <http://schema.org/8> "_:f0102aef-e827-4b15-aba4-6a99e424593b";
 <http://schema.org/9> "_:c8152b02-0a20-4c9b-97fb-8f92114676be";
 <http://schema.org/10> "_:7cf7b39c-5caa-48ea-a978-b445294fd966";
 <http://schema.org/11> "_:8587f008-32f5-4ac4-9522-81c2cb8b02b1" .
_:63aa3ba5-c02d-4aa7-9504-c5f0760383bd <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "I regard it as a ravishing exercise in near-despair, with Bond beset by the suspicion that, were he to desist, both his character and his cause would be unmasked as a void. Killing is his living, and his proof of life.";
 <http://schema.org/url> "http://www.newyorker.com/magazine/2015/11/16/human-bondage";
 <http://schema.org/dateCreated> "2015-11-08T20:48:44-08:00";
 <http://schema.org/author> "_:46faad16-b1e2-4459-8be0-fd6a78685634";
 <http://schema.org/publisher> "_:13ac67ea-4dec-4bf8-aa66-b25b42c2e0f6";
 <http://schema.org/reviewRating> "_:9a8e1e24-7c1a-4acd-9f84-e7a0c96d4df7" .
_:5a3e4ff3-225c-4d3d-9f3d-085bfad9856b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "Dazzles early and fizzles late...Bond is not Batman; he does not need an origin story.";
 <http://schema.org/url> "http://www.theatlantic.com/entertainment/archive/2015/11/james-bond-daniel-craig-spectre/414552/";
 <http://schema.org/dateCreated> "2015-11-07T06:30:53-08:00";
 <http://schema.org/author> "_:790b3a6a-292e-4ebb-a0cf-493009b79823";
 <http://schema.org/publisher> "_:d08c5b58-e52a-408f-9e27-7ead25e6a0f1";
 <http://schema.org/reviewRating> "_:b5a9b6ad-24eb-4f55-b3dd-113cf75ba65c" .
_:54a398c5-f766-471b-8114-3df2a4855653 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "There are signs of Bond bloat within many of the action sequences - it must be hard to trim such extravagant footage - but they are at least partly overcome by an increase in levity. ";
 <http://schema.org/url> "http://www.sandiegoreader.com/movies/spectre/";
 <http://schema.org/dateCreated> "2015-11-06T06:09:49-08:00";
 <http://schema.org/author> "_:2126791b-6712-4b11-ba24-0e2872150bcd";
 <http://schema.org/publisher> "_:fad453dd-bc05-4fef-ac3c-c320fcdd4f26";
 <http://schema.org/reviewRating> "_:c7fa3120-6022-449e-a9b4-b6c3de7bf32b" .
_:afc80ad9-c094-4c4e-a910-484e0d50e31d <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "If one of the most successful and long-running franchises in movie history wants to keep pumping, it's once again time to change the formula.";
 <http://schema.org/url> "http://www.csmonitor.com/The-Culture/Movies/2015/1106/Spectre-references-old-Bond-movies-without-a-fresh-spin";
 <http://schema.org/dateCreated> "2015-11-06T02:43:19-08:00";
 <http://schema.org/author> "_:c2297644-a889-46f8-8b17-6b2922b5eb79";
 <http://schema.org/publisher> "_:7f710dfe-8958-42b4-a425-b81afb3e16ee";
 <http://schema.org/reviewRating> "_:894cb210-b169-4a7d-a52c-9ebfba8f32dd" .
_:505cc865-1613-4167-8b02-677a23188efd <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "For the most part, it's efficient-enough Bond fare - overlong car chases, beautiful women in eternal danger, crazy stunts, suave cool under fire. Nice fitting suits.";
 <http://schema.org/url> "http://www.detroitnews.com/story/entertainment/movies/2015/11/05/movie-review-bond-uncovers-worldwide-conspiracy-spectre/75267748/";
 <http://schema.org/dateCreated> "2015-11-05T18:45:53-08:00";
 <http://schema.org/author> "_:7a11b03f-cb45-4511-b703-a91ea263956c";
 <http://schema.org/publisher> "_:68e4f5f8-9fdd-4632-86d1-0f400ec88795";
 <http://schema.org/reviewRating> "_:4a13fa7f-ad30-4968-8348-453416985cb9" .
_:4c8d82e6-c563-46fc-b431-a5424371496a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "SPECTRE doesn't quite measure up, but it's still a good night out.";
 <http://schema.org/url> "https://www.rte.ie/entertainment/movies/2015/1024/737225-review-spectre/";
 <http://schema.org/dateCreated> "2016-07-19T01:38:34-07:00";
 <http://schema.org/author> "_:2352c4c7-5026-4fcc-9118-b88f29d8f708";
 <http://schema.org/publisher> "_:deaa8dc0-35c7-4c52-b58b-ed3138ff71fe";
 <http://schema.org/reviewRating> "_:76aa65d4-3d17-442f-9084-ba7f148e2c30" .
_:1b7fd8a8-e39a-4322-9dfc-f60e49d0e912 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "[Daniel Craig's] latest adventure feels more like an homage to Bond's past than a continuation of his recent hot streak.";
 <http://schema.org/url> "http://freebeacon.com/culture/spectre-review/";
 <http://schema.org/dateCreated> "2016-07-14T12:03:45-07:00";
 <http://schema.org/author> "_:dca176c5-6f28-4490-ad5c-9c354e333e24";
 <http://schema.org/publisher> "_:ba058ccb-1eaa-4fd1-a7cf-233540f97ee1";
 <http://schema.org/reviewRating> "_:486982d7-dd8b-45c8-81a0-83946e6ad91a" .
_:f0102aef-e827-4b15-aba4-6a99e424593b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "Daniel Craig recently said that he'd rather \\"kill himself\\" than do another Bond film -- and in Spectre, his misery shows.";
 <http://schema.org/url> "http://www.baltimoremagazine.net/2015/11/5/review-spectre";
 <http://schema.org/dateCreated> "2016-06-12T13:15:04-07:00";
 <http://schema.org/author> "_:444e9bc7-a57c-4414-9923-7404fc1c0445";
 <http://schema.org/publisher> "_:992d1a08-179f-4428-9cbd-6f4c3efe2e5b";
 <http://schema.org/reviewRating> "_:1f162765-4db6-4a46-93c6-22c755074f76" .
_:c8152b02-0a20-4c9b-97fb-8f92114676be <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "For large portions of the middle, this is the most that a Bond film has felt like a Bond film since Pierce Brosnan retired.";
 <http://schema.org/url> "http://reviews.antagonyecstasy.com/2015/11/bond-ambition.html";
 <http://schema.org/dateCreated> "2016-06-05T13:52:35-07:00";
 <http://schema.org/author> "_:92e732cc-8004-4f26-8928-5a8107616750";
 <http://schema.org/publisher> "_:c6b6de4a-11b7-4d3a-9c35-9839b9a96bbc";
 <http://schema.org/reviewRating> "_:76032707-680b-4508-ad65-a3589311d13c" .
_:7cf7b39c-5caa-48ea-a978-b445294fd966 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "The 24 Bond films sugarcoat a profession that really boils down to a whole lot of breaking-and-entering, snooping, and cold-blooded murder. This one's still decent though.";
 <http://schema.org/url> "http://www.theepochtimes.com/n3/1889637-spectre-film-review-its-the-end-of-bond-as-we-know-it-and-we-feel-fine/";
 <http://schema.org/dateCreated> "2016-05-26T11:21:17-07:00";
 <http://schema.org/author> "_:cbbc9adc-fe99-417f-b610-86e5cdb9f9f0";
 <http://schema.org/publisher> "_:8d65cb7b-23cf-401b-94a0-d3726e07f47a";
 <http://schema.org/reviewRating> "_:c42bc5c3-6a34-4e69-8a7c-f32ada913315" .
_:8587f008-32f5-4ac4-9522-81c2cb8b02b1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewBody> "It will surely be catnip for the hardcore fans, although younger viewers may find it too narratively clunky and self-referential to be involving. ";
 <http://schema.org/url> "http://www.washingtoncitypaper.com/arts/film-tv/article/13047330/spectre-reviewed";
 <http://schema.org/dateCreated> "2016-05-20T11:33:27-07:00";
 <http://schema.org/author> "_:d51333c3-7657-482c-bf1f-2ca7be8535ad";
 <http://schema.org/publisher> "_:d524a691-e949-4eba-a4b4-81211022237a";
 <http://schema.org/reviewRating> "_:5b6b218d-948f-49bf-9b21-27ee8e82aa64" .
_:d246094f-8c47-4798-87be-64396ec6e0be <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/PublicationEvent";
 <http://schema.org/startDate> "2015-11-06";
 <http://schema.org/name> "Theater" .
_:2fa8bc71-b0b7-4af8-a722-67ca36f21311 <http://schema.org/0> "_:d246094f-8c47-4798-87be-64396ec6e0be";
 <http://schema.org/1> "_:8e11c70c-49d9-42ea-ab81-98c59c91582a" .
_:8e11c70c-49d9-42ea-ab81-98c59c91582a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/PublicationEvent";
 <http://schema.org/startDate> "2016-02-09";
 <http://schema.org/name> "DVD" .
_:ba3bb712-dbad-476a-8ce9-7c41e6a619c9 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "James Bond" .
_:27e7ac4b-913f-4f8b-86b3-fcb7ae931e8a <http://schema.org/0> "_:ba3bb712-dbad-476a-8ce9-7c41e6a619c9";
 <http://schema.org/1> "_:0a2583db-25da-456c-931e-f5528eb66801";
 <http://schema.org/2> "_:c4f18708-c50b-4024-81cd-bb5dff8d0b76";
 <http://schema.org/3> "_:abeae001-f7fb-49b4-a7d3-c3f6fae338c5";
 <http://schema.org/4> "_:206f3545-9519-4f02-92b4-a392c93e6138";
 <http://schema.org/5> "_:d6a45d2c-12e3-47c4-b85d-9174d4be4ee7";
 <http://schema.org/6> "_:8af52c3d-2767-4659-97b5-01ab9555f76f";
 <http://schema.org/7> "_:65b41333-0126-4249-acf3-c7e1b09e21ff";
 <http://schema.org/8> "_:12f36fa6-fa2f-4ac5-b9a0-85bd0b80bc96";
 <http://schema.org/9> "_:7786477f-53f6-4f17-a565-b8d448c9e093";
 <http://schema.org/10> "_:facd3c60-e8d2-4bea-9106-ce9de6a0df66";
 <http://schema.org/11> "_:578923a1-cdca-4232-9ad7-21f29243c9ff";
 <http://schema.org/12> "_:635d8343-9dcf-45c4-9973-f056cbf16f3f";
 <http://schema.org/13> "_:cadfdc7d-5b79-4d56-80d4-9e93bb2df4a3";
 <http://schema.org/14> "_:3263104d-e5b1-4994-ad28-9ca331001ea3";
 <http://schema.org/15> "_:5973fd96-4e87-4596-92a7-afd9218999f8";
 <http://schema.org/16> "_:79add03d-f207-4bc2-976d-e4e9b279e5f4";
 <http://schema.org/17> "_:b2753f1f-b4ae-4911-a576-5f999053db12";
 <http://schema.org/18> "_:a05d8fdf-9531-4a26-98b7-98337bd612a6";
 <http://schema.org/19> "_:9e3a5115-cb18-47bb-93ac-1c328dd3441f" .
_:0a2583db-25da-456c-931e-f5528eb66801 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Franz Oberhauser" .
_:c4f18708-c50b-4024-81cd-bb5dff8d0b76 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Eve Moneypenney" .
_:abeae001-f7fb-49b4-a7d3-c3f6fae338c5 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Q" .
_:206f3545-9519-4f02-92b4-a392c93e6138 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Mr. Hinx" .
_:d6a45d2c-12e3-47c4-b85d-9174d4be4ee7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Lucia Sciarra" .
_:8af52c3d-2767-4659-97b5-01ab9555f76f <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "M" .
_:65b41333-0126-4249-acf3-c7e1b09e21ff <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Mr. White" .
_:12f36fa6-fa2f-4ac5-b9a0-85bd0b80bc96 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Estrella" .
_:7786477f-53f6-4f17-a565-b8d448c9e093 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Denbigh" .
_:facd3c60-e8d2-4bea-9106-ce9de6a0df66 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Bill Tanner" .
_:578923a1-cdca-4232-9ad7-21f29243c9ff <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Madeleine Swann" .
_:635d8343-9dcf-45c4-9973-f056cbf16f3f <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Marco Sciarra" .
_:cadfdc7d-5b79-4d56-80d4-9e93bb2df4a3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Mexican Man in Lift" .
_:3263104d-e5b1-4994-ad28-9ca331001ea3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Mexican Woman in Lift" .
_:5973fd96-4e87-4596-92a7-afd9218999f8 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Gallo" .
_:79add03d-f207-4bc2-976d-e4e9b279e5f4 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Gallo" .
_:b2753f1f-b4ae-4911-a576-5f999053db12 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Gallo's Accomplice" .
_:a05d8fdf-9531-4a26-98b7-98337bd612a6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Gallo's Accomplice" .
_:9e3a5115-cb18-47bb-93ac-1c328dd3441f <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "Gallo's Accomplice" .
_:620cf7bf-0c8f-45fe-b863-0a7275619de7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/alison-willmore";
 <http://schema.org/name> "Alison Willmore" .
_:bf733c71-0a43-4698-9bc9-a3cd8b0c4a3a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "BuzzFeed News" .
_:8b9cb4f9-0a98-4420-991e-ad8d3f879aa3 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "-1" .
_:46faad16-b1e2-4459-8be0-fd6a78685634 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/anthony-lane";
 <http://schema.org/name> "Anthony Lane" .
_:13ac67ea-4dec-4bf8-aa66-b25b42c2e0f6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "New Yorker" .
_:9a8e1e24-7c1a-4acd-9f84-e7a0c96d4df7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:790b3a6a-292e-4ebb-a0cf-493009b79823 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/christopher-orr";
 <http://schema.org/name> "Christopher Orr" .
_:d08c5b58-e52a-408f-9e27-7ead25e6a0f1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "The Atlantic" .
_:b5a9b6ad-24eb-4f55-b3dd-113cf75ba65c <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:2126791b-6712-4b11-ba24-0e2872150bcd <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/matthew-lickona";
 <http://schema.org/name> "Matthew Lickona" .
_:fad453dd-bc05-4fef-ac3c-c320fcdd4f26 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "San Diego Reader" .
_:c7fa3120-6022-449e-a9b4-b6c3de7bf32b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:c2297644-a889-46f8-8b17-6b2922b5eb79 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/peter-rainer";
 <http://schema.org/name> "Peter Rainer" .
_:7f710dfe-8958-42b4-a425-b81afb3e16ee <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Christian Science Monitor" .
_:894cb210-b169-4a7d-a52c-9ebfba8f32dd <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "-1" .
_:7a11b03f-cb45-4511-b703-a91ea263956c <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/tom-long";
 <http://schema.org/name> "Tom Long" .
_:68e4f5f8-9fdd-4632-86d1-0f400ec88795 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Detroit News" .
_:4a13fa7f-ad30-4968-8348-453416985cb9 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:2352c4c7-5026-4fcc-9118-b88f29d8f708 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/harry-guerin";
 <http://schema.org/name> "Harry Guerin" .
_:deaa8dc0-35c7-4c52-b58b-ed3138ff71fe <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "RTÉ (Ireland)" .
_:76aa65d4-3d17-442f-9084-ba7f148e2c30 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:dca176c5-6f28-4490-ad5c-9c354e333e24 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/sonny-bunch";
 <http://schema.org/name> "Sonny Bunch" .
_:ba058ccb-1eaa-4fd1-a7cf-233540f97ee1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Washington Free Beacon" .
_:486982d7-dd8b-45c8-81a0-83946e6ad91a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "-1" .
_:444e9bc7-a57c-4414-9923-7404fc1c0445 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/max-weiss";
 <http://schema.org/name> "Max Weiss" .
_:992d1a08-179f-4428-9cbd-6f4c3efe2e5b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Baltimore Magazine" .
_:1f162765-4db6-4a46-93c6-22c755074f76 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "-1" .
_:92e732cc-8004-4f26-8928-5a8107616750 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/tim-brayton";
 <http://schema.org/name> "Tim Brayton" .
_:c6b6de4a-11b7-4d3a-9c35-9839b9a96bbc <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Antagony & Ecstasy" .
_:76032707-680b-4508-ad65-a3589311d13c <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:cbbc9adc-fe99-417f-b610-86e5cdb9f9f0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/mark-jackson";
 <http://schema.org/name> "Mark Jackson" .
_:8d65cb7b-23cf-401b-94a0-d3726e07f47a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Epoch Times" .
_:c42bc5c3-6a34-4e69-8a7c-f32ada913315 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
_:d51333c3-7657-482c-bf1f-2ca7be8535ad <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/url> "www.rottentomatoes.com/critic/noah-gittell";
 <http://schema.org/name> "Noah Gittell" .
_:d524a691-e949-4eba-a4b4-81211022237a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Organization";
 <http://schema.org/name> "Washington City Paper" .
_:5b6b218d-948f-49bf-9b21-27ee8e82aa64 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/bestRating> "1";
 <http://schema.org/worstRating> "-1";
 <http://schema.org/ratingValue> "1" .
<http://www.imdb.com/title/tt2379713/> <http://ogp.me/ns#url> "http://www.imdb.com/title/tt2379713/";
 <http://ogp.me/ns#image> "http://ia.media-imdb.com/images/M/MV5BMjM2Nzg4MzkwOF5BMl5BanBnXkFtZTgwNzA0OTE3NjE@._V1_UY1200_CR90,0,630,1200_AL_.jpg";
 <http://ogp.me/ns#type> "video.movie";
 <http://www.facebook.com/2008/fbmlapp_id> "115109575169727";
 <http://ogp.me/ns#title> "Spectre (2015)";
 <http://ogp.me/ns#site_name> "IMDb";
 <http://ogp.me/ns#description> "Directed by Sam Mendes.  With Daniel Craig, Christoph Waltz, Léa Seydoux, Ralph Fiennes. A cryptic message from Bond's past sends him on a trail to uncover a sinister organization. While M battles political forces to keep the secret service alive, Bond peels back the layers of deceit to reveal the terrible truth behind SPECTRE." .
_:0013018d-fea6-4c8a-aaba-e5a7c39b4a01 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/ratingValue> "1" .
_:f0e9ee18-3797-495b-87ca-b7180c5fd4ff <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "TestAuthor" .
_:8dcac657-96b5-436f-afa9-eaf27add6b5a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewRating> "_:0013018d-fea6-4c8a-aaba-e5a7c39b4a01";
 <http://schema.org/Author> "_:f0e9ee18-3797-495b-87ca-b7180c5fd4ff" .
_:c5b80d4f-65ae-4132-b599-5eebfe8e7132 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/ratingValue> "4" .
_:7fb66b96-2b3c-476b-9881-b327a7921747 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "TestAuthor" .
_:e42ba5bc-2dde-44c9-bb37-4864871a180e <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewRating> "_:c5b80d4f-65ae-4132-b599-5eebfe8e7132";
 <http://schema.org/Author> "_:7fb66b96-2b3c-476b-9881-b327a7921747" .
_:372bef20-a936-42ee-8ebf-345254496278 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Rating";
 <http://schema.org/ratingValue> "5" .
_:3d898c50-b3dd-432b-ace3-93b626e33440 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Person";
 <http://schema.org/name> "TestAuthor" .
_:6388e6bc-7b2a-4420-8f3c-7cfd913671a8 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "http://schema.org/Review";
 <http://schema.org/reviewRating> "_:372bef20-a936-42ee-8ebf-345254496278";
 <http://schema.org/Author> "_:3d898c50-b3dd-432b-ace3-93b626e33440" .`;
}
