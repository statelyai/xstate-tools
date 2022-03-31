import { createMachine } from "xstate";

export const transitionDescription = createMachine({
	id: "TransitionDescriptionMachine",
	type: "parallel",
	states: {
		Ticket: {
			initial: "Open",
			states: {
				Open: {
					on: {
						cancel: {
							actions: "cancel ticket",
							target: "Canceled",
							description: "This is description example",
						},
					},
				},
				Canceled: {},
			},
		},
	},
});
