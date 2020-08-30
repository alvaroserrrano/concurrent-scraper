### Backend

```cd ./backend```

```
docker login --username=your_username --password=your_password
docker build -t your_username/concurrent-scraper .
docker run -p 5000:5000 -d your_username/concurrent-scraper
curl http://localhost:5000/
curl --header "Content-Type: application/json"   --request POST   --data '{"url": "http://books.toscrape.com/index.html" , "nrOfPages":1 , "commands":[{"description": "get items metadata", "locatorCss": ".product_pod","type": "getItems"},{"description": "go to next page","locatorCss": ".next > a:nth-child(1)","type": "Click"}]}'   http://localhost:5000/api/books
curl --header "Content-Type: application/json"   --request POST   --data '{"url": "http://books.toscrape.com/catalogue/slow-states-of-collapse-poems_960/index.html" , "nrOfPages":1 , "commands":[{"description": "get item details", "locatorCss": "article.product_page","type": "getItemDetails"}]}'   http://localhost:5000/api/booksDetails
docker stop $(docker ps -a -q)
docker push your_username/concurrent-scraper:latest
```

```cd ./k8s```

```
kubectl create namespace concurrent-scraper-context
kubectl config set-context --current --namespace=concurrent-scraper-context
kubectl apply -f app-deployment.yaml
kubectl get deployment -w
```
Create the load balancer service as ./k8s/load-balancer.yaml

```
kubectl apply -f load-balancer.yaml
kubectl get services -w
```

```npm start 0```
```npm start 1```

accelerate scraper
```kubectl scale deployment scraper --replicas=10```






