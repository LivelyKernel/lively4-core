#!/bin/bash
git status --porcelain | grep  "??" | sed 's/^?? /git add /' | bash
echo -n "SYNC " > COMMIT ; 
git status --porcelain | grep -v "??" | tr "\n" ";">> COMMIT;
cat COMMIT 
 git commit -F COMMIT .; 
# git pull --no-edit; 
# git push origin gh-pages
