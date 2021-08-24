import * as yup from 'yup';

export const contractSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'erc20', 'realitio'])
    .required('Contract is required!'),
  method: yup.string().required('Method is required!')
});
