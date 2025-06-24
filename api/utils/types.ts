import { EventId, SuiEvent, SuiEventFilter } from "@mysten/sui/dist/cjs/client";

export type SuiEventsCursor = EventId | null | undefined;

export type EventExecutionResult = {
    cursor: SuiEventsCursor;
    hasNextPage: boolean;
};

export type EventTracker = {
    // The module that defines the type, with format `package::module`
    type: string;
    filter: SuiEventFilter;
    callback: (events: SuiEvent[], type: string) => any;
};