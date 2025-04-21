module simple_counter::simple_counter {
    public struct Counter has key {
        id: UID,
        value: u64
    }

    /// Create and share a counter object
    public entry fun create(ctx: &mut TxContext) {
        transfer::share_object(Counter {
            id: object::new(ctx),
            value: 0
        })
    }

    /// Anyone can increment the counter
    public entry fun increment(counter: &mut Counter) {
        counter.value = counter.value + 1;
    }

    public entry fun set_value(counter: &mut Counter, value: u64) {
        counter.value = value;
    }

    /// View function to get the current value
    public fun get_value(counter: &Counter): u64 {
        counter.value
    }
}