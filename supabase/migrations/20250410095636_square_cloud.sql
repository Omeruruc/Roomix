/*
  # Delete Smart kamp room

  1. Changes
    - Delete the "Smart kamp" room
    - Associated messages and room_users will be automatically deleted due to CASCADE
*/

DELETE FROM rooms 
WHERE name = 'Smart kamp';