# Merge Conflicts

Problem: different to detecting and resolving merge conflicts when writing a file, there can be a non resolvable merge conflict when syncing repositories. This a general problem in the lively workflow, since solving these conflicts is not to well supported by our tool chain. 

While pressing "sync" in the "sync" tool, the it can come to a conflict that git cannot resolve itself (since it only resolves merges when they are not touching the same lines).

```
REPO:  /home/lively4/lively4//lively4-dummyA USERNAME:  JensLincke
COMMIT A
On branch master
Your branch is ahead of 'origin/master' by 1 commit.
  (use "git push" to publish your local commits)
nothing to commit, working directory clean
PULL
From https://github.com/LivelyKernel/lively4-dummy
 * branch            master     -> FETCH_HEAD
Auto-merging writetest2.txt
CONFLICT (content): Merge conflict in writetest2.txt
Automatic merge failed; fix conflicts and then commit the result.
PUSH2
git push https://JensLincke:4f1ae87xxx@github.com/LivelyKernel/lively4-dummy master
To https://JensLincke:4f1ae87xxxx@github.com/LivelyKernel/lively4-dummy
 ! [rejected]        master -> master (non-fast-forward)
error: failed to push some refs to 'https://JensLincke:4f1ae870xxx@github.com/LivelyKernel/lively4-dummy'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
FETCH AGAIN
From https://github.com/LivelyKernel/lively4-dummy
   489efa3..12b9786  master     -> origin/master
invalidate local caches
```

After line we are looking for is `CONFLICT (content): Merge conflict in writetest2.txt`. After this pressing status will get us a shorter:

```
On branch master
Your branch and 'origin/master' have diverged,
and have 1 and 1 different commit each, respectively.
  (use "git pull" to merge the remote branch into yours)
You have unmerged paths.
  (fix conflicts and run "git commit")
Unmerged paths:
(use "git add <file>..." to mark resolution)


  both modified:   writetest2.txt


no changes added to commit (use "git add" and/or "git commit -a")
79ee119	JensLincke	Thu, 2 Apr 2020 16:17:18 +0200	A
12b9786	JensLincke	Thu, 2 Apr 2020 16:17:10 +0200	B
```

Which is the output of 

```bash
git -c color.status=always  status;
git log --color=always HEAD...origin/${branch} --pretty="format:%h\t%aN\t%cD\t%f"`;
```

### Resolving the Conflict

The workflow at the moment is:

- visiting the conflict with the browser
- manually getting rid of the conflict by editing the source code
- saving the file and through that, indirectly resolving the conflict. 

The underlying git repository will then continue to work fine. 

### Problem with Annotations

This manual  conflict resolution does not make sense for our annotations file. But this should be not a problem since we can merge annotations automatically. Therefore we have to overcome two issues:

- (A) detecting a merge conflict in the sync tool 
- (B) triggering the merge annotation code with the correct conflicting version. 

The conflicting version is at least displayed inline the the file:

```
<<<<<<< HEAD
world foo211 
=======
foo211 hello
>>>>>>> 12b978686dfaf6bb77d2325c5028d337b3882087
```

Or maybe we should be able to ask git for the version number of the conflict. But since we don't want to require a server code change yet, lets go with extracting the conflicting git revision hash from the source of the file!






