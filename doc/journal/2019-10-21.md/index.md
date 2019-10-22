## 2019-10-21 GitHub User Info

Finding Github users in a team works, at least in the client...

Happy Case: 

```javascript

import GitHub from "src/client/github.js"

async function githubIsUserInTeam(org, teamName) {
  let gh = new GitHub(org, teamName);
  await gh.loadCredentials()
  let teamInfo = await fetch(`https://api.github.com/orgs/${org}/teams/${teamName}`, {
    method: "GET",
    headers: {
      Authorization: "token " + gh.token  
    }
  }).then(r => r.json());    
  
  let members = await fetch(teamInfo.members_url.replace(/\{.*/,""), {
    method: "GET",
    headers: {
      Authorization: "token " + gh.token  
    }
  }).then(r => r.json());
  return members.map(ea => ea.login).includes(gh.username)
}

githubIsUserInTeam("hpi-swa-lab", "BP2019RH1")

```


# #TODO

- [ ] do it on the server.
- [ ] guard against... many levels of not allowed... not in team, not a user etc..






        





