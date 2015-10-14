
all:
	echo "sync: pulls, commit, push..."


sync:
		git pull --no-edit; echo -n "SYNC " > COMMIT ; 
		git status --porcelain | grep -v "??" | tr "\n" ";">> COMMIT; 
		git commit -F COMMIT .; 
		git push origin gh-pages
