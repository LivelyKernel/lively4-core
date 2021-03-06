## 2019-08-16 #Microsoft Graph API


and here we go...


## Navigating in OneDrive 

![](OneDrive_Navigation.png)


## Navigating to (Excel) Worksheet

![](file_190816_063312.png)




## Getting Data out of the Worksheet with `fetch`

```javascript
fetch("microsoft://me/drive/root:/Documents/Book.xlsx:/workbook/worksheets/Sheet1/range(address='A1:A1')").then(r => r.json())
```

## And getting Data into the Worksheet with a `PATCH` request

```javascript

fetch("microsoft://me/drive/root:/Documents/Book.xlsx:/workbook/worksheets/Sheet1/range(address='A1:A1')", {
  method: "PATCH",
  body: JSON.stringify({
    values: [["hello"]]
  })
}).then(r => r.text())
```

And Voila


![](hello_in_excel.png)


### And with Formulas

```


fetch("microsoft://me/drive/root:/Documents/Book.xlsx:/workbook/worksheets/Sheet1/range(address='A1:B2')", {
  method: "PATCH",
  body: JSON.stringify({
"values" : [["Hello", "100"],["1/1/2016", null]],
"formulas" : [[null, null], [null, "=B1*4"]],
"numberFormat" : [[null,null], ["m-ddd", null]]
})
}).then(r => r.text())
```
