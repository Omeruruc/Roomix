/*
  # Delete specific rooms

  1. Changes
    - Delete "Smartkamp" and "Smart2" rooms
    - Associated messages and room_users will be automatically deleted due to CASCADE
*/

DELETE FROM rooms 
WHERE name IN ('Smart kamp', 'Smart2');