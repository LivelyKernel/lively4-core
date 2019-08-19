## 2019-08-19 #OneNote via #Microsoft Protocol

### Microsoft uses POID ;-) #RelatedWork

![](onenote_poid.png)


```javascript
 {
      "id": "0-D333AEE656452F8B!405118",
      "self": "https://graph.microsoft.com/v1.0/users/jensl81@gmx.de/onenote/notebooks/0-D333AEE656452F8B!405118",
      "createdDateTime": "2017-12-20T14:04:21.77Z",
      "displayName": "COP2018",
      "lastModifiedDateTime": "2018-01-22T09:34:21.603Z",
      "isDefault": false,
      "userRole": "Owner",
      "isShared": true,
      "sectionsUrl": "https://graph.microsoft.com/v1.0/users/jensl81@gmx.de/onenote/notebooks/0-D333AEE656452F8B!405118/sections",
      "sectionGroupsUrl": "https://graph.microsoft.com/v1.0/users/jensl81@gmx.de/onenote/notebooks/0-D333AEE656452F8B!405118/sectionGroups",
      "createdBy": {
        "user": {
          "id": "D333AEE656452F8B",
          "displayName": "Jens Lincke"
        }
      },
      "lastModifiedBy": {
        "user": {
          "id": "D333AEE656452F8B",
          "displayName": "Jens Lincke"
        }
      },
      "links": {
        "oneNoteClientUrl": {
          "href": "onenote:https://d.docs.live.net/d333aee656452f8b/Documents/COP2018"
        },
        "oneNoteWebUrl": {
          "href": "https://onedrive.live.com/redir.aspx?cid=d333aee656452f8b&page=edit&resid=D333AEE656452F8B!405118"
        }
      }
    },
```



### Patch #OneNote Elements

works as described on https://docs.microsoft.com/en-us/graph/onenote-update-page

```javascript
fetch("microsoft://users/jensl81@gmx.de/onenote/pages/0-d277a55b04d2418cb8238a97b25d6656!9-D333AEE656452F8B!169954/content", {
  method: "PATCH",
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    {
      'target':'p:{85276b74-153d-4f23-b2d8-36666ea7c8e2}{232}',
      'action':'replace',
      'content':'<p>and what about this?</p>'
    }
  ])
}).then(r => r.text())
```


![](onenote_what_about_this.png)
