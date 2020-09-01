## 2020-08-27 BP2019 Technical Report
*Author: @JensLincke*

First draft of my overview vis for giant BP thesis / Tr: 

![](bp2019_tr_overview_vis1.png)


### Markdown LaTex issues...


```markdown

\noindent The technical...
```


``` 
\cites{Keim1997VTE}{Keim1996VTM}

does not work yet: [@Keim1997VTE, @Keim1996VTM]

```

```markdown

does NOT  work (yet):
![fig:2-divergingConverging](../../figures/topic2/convergediverge.jpg "The diverging and converging process in Design Thinking [@Lewrick2018DTP].")


does work:

![fig:2-divergingConverging](../../figures/topic2/convergediverge.jpg "The diverging and converging process in Design Thinking \cites{Lewrick2018DTP}.")
```