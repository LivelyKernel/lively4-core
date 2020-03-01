import superagentPromise from 'src/external/superagent-promise.js';
import _superagent from 'src/external/superagent.js';

let authStore;
let commonStore;
const setAuthStore = newAuthStore =>
  authStore = newAuthStore;
const setCommonStore = newCommonStore =>
  commonStore = newCommonStore;

const superagent = superagentPromise(_superagent, Promise);

const API_ROOT = 'https://conduit.productionready.io/api';

const encode = encodeURIComponent;

const handleErrors = err => {
  if (err && err.response && err.response.status === 401 && authStore) {
    authStore.logout();
  }
  return err;
};

const responseBody = res => res.body;

const tokenPlugin = req => {
  if (commonStore && commonStore.token) {
    req.set('authorization', `Token ${commonStore.token}`);
  }
};

const requests = {
  del: url =>
    superagent
      .del(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .end(handleErrors)
      .then(responseBody),
  get: url =>
    superagent
      .get(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .end(handleErrors)
      .then(responseBody),
  put: (url, body) =>
    superagent
      .put(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .end(handleErrors)
      .then(responseBody),
  post: (url, body) =>
    superagent
      .post(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .end(handleErrors)
      .then(responseBody),
};

const Auth = {
  current: () =>
    requests.get('/user'),
  login: (email, password) =>
    requests.post('/users/login', { user: { email, password } }),
  register: (username, email, password) =>
    requests.post('/users', { user: { username, email, password } }),
  save: user =>
    requests.put('/user', { user })
};

const Tags = {
  getAll: () => requests.get('/tags')
};

const limit = (count, p) => `limit=${count}&offset=${p ? (p - 1) * count : 0}`;
const omitSlug = article => Object.assign({}, article, { slug: undefined })

const Articles = {
  all: (page = 0, lim = 10) =>
    requests.get(`/articles?${limit(lim, page)}`),
  byAuthor: (author, page = 0, lim = 10) =>
    requests.get(`/articles?author=${encode(author)}&${limit(lim, page)}`),
  byTag: (tag, page = 0, lim = 10) =>
    requests.get(`/articles?tag=${encode(tag)}&${limit(lim, page)}`),
  del: slug =>
    requests.del(`/articles/${slug}`),
  favorite: slug =>
    requests.post(`/articles/${slug}/favorite`),
  favoritedBy: (author, page = 0, lim = 10) =>
    requests.get(`/articles?favorited=${encode(author)}&${limit(lim, page)}`),
  feed: (page = 0, lim = 10) =>
    requests.get(`/articles/feed?${limit(lim, page)}`),
  get: slug =>
    requests.get(`/articles/${slug}`),
  unfavorite: slug =>
    requests.del(`/articles/${slug}/favorite`),
  update: article =>
    requests.put(`/articles/${article.slug}`, { article: omitSlug(article) }),
  create: article =>
    requests.post('/articles', { article })
};

const Comments = {
  create: (slug, comment) =>
    requests.post(`/articles/${slug}/comments`, { comment }),
  delete: (slug, commentId) =>
    requests.del(`/articles/${slug}/comments/${commentId}`),
  forArticle: slug =>
    requests.get(`/articles/${slug}/comments`)
};

const Profile = {
  follow: username =>
    requests.post(`/profiles/${username}/follow`),
  get: username =>
    requests.get(`/profiles/${username}`),
  unfollow: username =>
    requests.del(`/profiles/${username}/follow`)
};

export default {
  setAuthStore,
  setCommonStore,
  Articles,
  Auth,
  Comments,
  Profile,
  Tags,
};