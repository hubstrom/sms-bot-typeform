$(document).foundation()
$(function() {
  // GET/READ
  //    $('#get-button').on('click', function() {
  $.ajax({
    url: '/tasks/get-rides',
    contentType: 'application/json',
    success: function(response) {
      var bike_tasksEl = $('tbody#all-bikes');
      response.bike_tasks.forEach(function(bike_tasks){
        bike_tasksEl.append('\
                        <tr>\
                            <td class="username">' + bike_tasks.username + '</td>\
                            <td class="Total">' + bike_tasks.total + '</td>\
                        </tr>\
                    ');
      })
    }
  });
});
/*
  <td class="monday">' + bike_tasks.monday + '</td>\
  <td class="tuesday">' + bike_tasks.tuesday + '</td>\
  <td class="wednesday">' + bike_tasks.wednesday + '</td>\
  <td class="thursday">' + bike_tasks.thursday + '</td>\
  <td class="friday">' + bike_tasks.friday + '</td>\
  <td class="saturday">' + bike_tasks.saturday + '</td>\
  <td class="sunday">' + bike_tasks.sunday + '</td>\
*/
