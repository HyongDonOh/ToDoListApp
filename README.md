"# ToDoListApp" 

v1.1
1. prevent error on title
   - As ToDoList title is being used as filename, the filename should not include some characters.
     Asterisk(*) will be changed to "%2A"
     The following characters would be removed from TODoList title automatically.
     1) '
     2) "
     3) /
     4) \
