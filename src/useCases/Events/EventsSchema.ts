import * as yup from 'yup';

export const eventsSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'erc20', 'realitio'])
    .required('Contract is required!'),
  eventName: yup.string().required('Event name is required!')
});
