module cross::caller {
    // Reference the counter module with the deployed address
    // Replace this with your actual deployed counter address

    /// Call the set_value function on the counter
    public entry fun update_counter(
        counter: &mut simple_counter::simple_counter::Counter,
        _ctx: &mut TxContext
    ) {
        // Set the counter value to 3
        simple_counter::simple_counter::set_value(counter, 9);
    }
}