## 2020-08-14 Playing around with #SAP #Graph
*Author: @JensLincke*

<https://beta.graph.sap/explorer>


![](sap_graph_explorer.png)


```javascript
fetch("https://api.graph.sap/beta/Customers/1000482", {
  method: "GET",
  headers: {
    authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZW1vLmFwaS5ncmFwaC5zYXAiLCJzdWIiOiJkZW1vQGdyYXBoLnNhcCIsImF1ZCI6ImRlbW8uYXBpLmdyYXBoLnNhcCIsImlhdCI6MTU2MzgwMjEyMCwiZXhwIjo0Njg4MDA0NTIwLCJqdGkiOiI5OGMxM2E4MC0xNTQwLTQ3MDUtODg3MC0wYzM1NmQ2MjE0MDMifQ.JohYTPz1_CX0Q79ubkqyIC8NNOZF9cPSS0G89TUKQiDs0P407H6L0rlS6bijOkzek1h7JWno0jOBGoUQSAmSR0WX2abCwh26T3np2UxBkOx6ROkm_mpr-MtsGyOXM_9JPuZYv1nOnuuBYIOg-0zduO5ePuyWN29iEpmaCw1I6XxDp1_hzFAjS8GcKOmV8ilTrPTy_2UFc39qRLnur_bKtQb8-NleYHcv9uXChK3WEvEx7-NbCofKdkf_VVzuKpsDzzn2CvG2pKo3fFU_FLV56PA2D5kiprRz8FJyEUjslWPZCht0awQMRs7ml_e-srP3XykuXWMBBBV15yHNP8HdVA",
    landscape: "Demo"
  }
}).then(r => r.json())


fetch("https://api.graph.sap/beta/SalesOrders", {
  method: "GET",
  headers: {
    authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZW1vLmFwaS5ncmFwaC5zYXAiLCJzdWIiOiJkZW1vQGdyYXBoLnNhcCIsImF1ZCI6ImRlbW8uYXBpLmdyYXBoLnNhcCIsImlhdCI6MTU2MzgwMjEyMCwiZXhwIjo0Njg4MDA0NTIwLCJqdGkiOiI5OGMxM2E4MC0xNTQwLTQ3MDUtODg3MC0wYzM1NmQ2MjE0MDMifQ.JohYTPz1_CX0Q79ubkqyIC8NNOZF9cPSS0G89TUKQiDs0P407H6L0rlS6bijOkzek1h7JWno0jOBGoUQSAmSR0WX2abCwh26T3np2UxBkOx6ROkm_mpr-MtsGyOXM_9JPuZYv1nOnuuBYIOg-0zduO5ePuyWN29iEpmaCw1I6XxDp1_hzFAjS8GcKOmV8ilTrPTy_2UFc39qRLnur_bKtQb8-NleYHcv9uXChK3WEvEx7-NbCofKdkf_VVzuKpsDzzn2CvG2pKo3fFU_FLV56PA2D5kiprRz8FJyEUjslWPZCht0awQMRs7ml_e-srP3XykuXWMBBBV15yHNP8HdVA",
    landscape: "Demo"
  }
}).then(r => r.json())



fetch("https://api.graph.sap/beta/SalesOrganizations", {
  method: "GET",
  headers: {
    authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZW1vLmFwaS5ncmFwaC5zYXAiLCJzdWIiOiJkZW1vQGdyYXBoLnNhcCIsImF1ZCI6ImRlbW8uYXBpLmdyYXBoLnNhcCIsImlhdCI6MTU2MzgwMjEyMCwiZXhwIjo0Njg4MDA0NTIwLCJqdGkiOiI5OGMxM2E4MC0xNTQwLTQ3MDUtODg3MC0wYzM1NmQ2MjE0MDMifQ.JohYTPz1_CX0Q79ubkqyIC8NNOZF9cPSS0G89TUKQiDs0P407H6L0rlS6bijOkzek1h7JWno0jOBGoUQSAmSR0WX2abCwh26T3np2UxBkOx6ROkm_mpr-MtsGyOXM_9JPuZYv1nOnuuBYIOg-0zduO5ePuyWN29iEpmaCw1I6XxDp1_hzFAjS8GcKOmV8ilTrPTy_2UFc39qRLnur_bKtQb8-NleYHcv9uXChK3WEvEx7-NbCofKdkf_VVzuKpsDzzn2CvG2pKo3fFU_FLV56PA2D5kiprRz8FJyEUjslWPZCht0awQMRs7ml_e-srP3XykuXWMBBBV15yHNP8HdVA",
    landscape: "Demo"
  }
}).then(r => r.json())

```

