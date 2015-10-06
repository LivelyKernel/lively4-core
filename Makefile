
all:
	echo "sync: pulls, commit, push..."


sync:
		git pull --no-edit; git commit -m "draft ace editor" .; git push origin gh-pages
