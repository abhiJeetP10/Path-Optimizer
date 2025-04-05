import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

app = Flask(__name__)
CORS(app)

def return_solution(data, manager, routing, solution):
    indexOrderAllVehicles = []
    time_dimension = routing.GetDimensionOrDie("Time")
    total_time = 0
    for vehicle_id in range(data["num_vehicles"]):
        indexOrderOneVehicle = []
        index = routing.Start(vehicle_id)
        plan_output = f"Route for vehicle {vehicle_id}:\n"
        while not routing.IsEnd(index):
            time_var = time_dimension.CumulVar(index)
            arrival_time = solution.Min(time_var)
            departure_time = solution.Max(time_var)
            indexOrderOneVehicle.append({
                "index": manager.IndexToNode(index),
                "arrival_time": arrival_time,
                "departure_time": departure_time
            })
            plan_output += (
                f"{manager.IndexToNode(index)}"
                f" Time({solution.Min(time_var)},{solution.Max(time_var)})"
                " -> "
            )
            index = solution.Value(routing.NextVar(index))
        time_var = time_dimension.CumulVar(index)
        arrival_time = solution.Min(time_var)
        departure_time = solution.Max(time_var)
        indexOrderOneVehicle.append({
            "index": manager.IndexToNode(index),
            "arrival_time": arrival_time,
            "departure_time": departure_time
        })
        plan_output += (
            f"{manager.IndexToNode(index)}"
            f" Time({solution.Min(time_var)},{solution.Max(time_var)})\n"
        )
        plan_output += f"Time of the route: {solution.Min(time_var)}min\n"
        total_time += solution.Min(time_var)
        print(plan_output)  # Added to print the plan output
        indexOrderAllVehicles.append(indexOrderOneVehicle)
    print(f"Total time of all routes: {total_time}min")
    return indexOrderAllVehicles

def solve_vehicle_routing(time_matrix, time_windows, waiting_time, num_vehicles):
    data = {
        "time_matrix": time_matrix,
        "time_windows": [tuple(map(lambda x: max(0, int(x * 60)), tw)) for tw in time_windows],  # Ensure non-negative time windows
        "waiting_time": waiting_time,
        "num_vehicles": num_vehicles,
        "depot": 0
    }

    manager = pywrapcp.RoutingIndexManager(
        len(data["time_matrix"]), data["num_vehicles"], data["depot"]
    )

    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        travel_time = int(data["time_matrix"][from_node][to_node] * 60)  # convert to minutes
        waiting_time = int(data['waiting_time']) if from_node != data['depot'] else 0  # Add uniform waiting time except at depot
        return travel_time + waiting_time

    transit_callback_index = routing.RegisterTransitCallback(time_callback)

    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    time = "Time"
    routing.AddDimension(
        transit_callback_index,
        30,  # allow waiting time
        1440,  # maximum time per vehicle route in minutes (24 hours)
        False,
        time,
    )
    time_dimension = routing.GetDimensionOrDie(time)

    print("Time windows:")
    for location_idx, time_window in enumerate(data["time_windows"]):
        print(f"Location {location_idx}: {time_window}")
        if location_idx == data["depot"]:
            continue
        index = manager.NodeToIndex(location_idx)
        start, end = time_window
        time_dimension.CumulVar(index).SetRange(start, end)  # already converted to minutes

    depot_idx = data["depot"]
    for vehicle_id in range(data["num_vehicles"]):
        index = routing.Start(vehicle_id)
        start, end = data["time_windows"][depot_idx]
        time_dimension.CumulVar(index).SetRange(start, end)  # already converted to minutes

    for i in range(data["num_vehicles"]):
        routing.AddVariableMinimizedByFinalizer(time_dimension.CumulVar(routing.Start(i)))
        routing.AddVariableMinimizedByFinalizer(time_dimension.CumulVar(routing.End(i)))

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC

    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        return return_solution(data, manager, routing, solution)
    else:
        print("No solution found.")
        return None

@app.route('/solve-vrp', methods=['POST'])
def solve_vrp():
    data = request.get_json()
    time_matrix = data['time_matrix']
    time_windows = data['time_windows']
    waiting_time = data['waiting_time']
    num_vehicles = data['num_vehicles']

    vrp_result = solve_vehicle_routing(time_matrix, time_windows, waiting_time, num_vehicles)
    return jsonify(vrp_result)

@app.route('/health')
def health():
    return {'status': 'ok'}, 200

# if __name__ == "__main__":
#     app.run(port=3000)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)