
run:
	docker build . -t template-react
	docker run -p 8080:80 template-react