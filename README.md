smtp-proxy-proto
=========================


#### install

```
    npm install
```


#### run


in a terminal
```
    node sample-smtp.js 
```

in another 
```
    node smtp-proxy-proto.js
```

command
```
    echo "test"| mutt -s "test" test@example.com -c test2@example.com  -a xxx.txt 
```

muttrc
```
    ...
    set smtp_url = "smtp://test@example.com@localhost:9025"
    set smtp_pass = "test"
    set from = "test@example.com"
    ...

```