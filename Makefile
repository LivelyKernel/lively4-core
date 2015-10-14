
all:
	echo "sync: pulls, commit, push..."


sync:
		git pull --no-edit; echo "SYNC " > COMMIT ; 
		git status --porcelain | grep -v "??"  >> COMMIT; 
		git commit -F COMMIT .; 
		git push origin gh-pages
